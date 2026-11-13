library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (clk, reset, active : in std_logic;
    duration : out std_logic_vector(3 downto 0);
    done : out std_logic);
end entity;
architecture rtl of top_module is
    signal count_r, duration_r : unsigned(3 downto 0) := (others => '0');
    signal done_r : std_logic := '0';
    begin
    duration <= std_logic_vector(duration_r);
    done <= done_r;
    process(clk) begin if rising_edge(clk) then
        if reset='1' then count_r <= (others=>'0');
            duration_r <= (others=>'0');
            done_r <= '0';
        else done_r <= '0';
            if active='1' then if count_r /= 15 then count_r <= count_r+1;
            end if;
        elsif count_r /= 0 then duration_r <= count_r;
            count_r <= (others=>'0');
            done_r <= '1';
        end if;
    end if;
end if;
end process;
end architecture;
