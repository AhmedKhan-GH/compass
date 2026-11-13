use work.ticket_pkg.all;
entity ticket_wrapper is
    port (
    issued_out  : out   natural;
    served_out  : out   natural;
    waiting_out : out   natural;
    done        : out   bit
    );
end entity ticket_wrapper;
architecture sim of ticket_wrapper is

    shared variable desk     : ticket_desk_t;
    signal          finished : bit_vector(2 downto 0) := (others => '0');
    begin

    desk.reset;
    clerk_a :
    process is
        begin
        wait
        for 1 ns;
            for i in 1 to 3 loop

                desk.issue;
            end loop;
            finished(0) <= '1';
            wait;
            end
            process clerk_a;
                clerk_b :
                process is
                    begin
                    wait
                    for 1 ns;
                        for i in 1 to 3 loop

                            desk.issue;
                        end loop;
                        finished(1) <= '1';
                        wait;
                        end
                        process clerk_b;
                            server :
                            process is
                                begin

                                desk.serve;
                                -- Serving an empty desk must leave every count at zero.
                                wait
                                for 2 ns;
                                    desk.serve;
                                    desk.serve;
                                    desk.serve;
                                    finished(2) <= '1';
                                    wait;
                                    end
                                    process server;
                                        publish :
                                        process is
                                            begin

                                            wait until finished = "111";
                                            issued_out  <= desk.issued;
                                            served_out  <= desk.served;
                                            waiting_out <= desk.waiting;
                                            done        <= '1';
                                            wait;
                                            end
                                            process publish;
                                            end architecture sim;
