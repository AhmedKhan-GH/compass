library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(message:in std_logic_vector(3 downto 0);
    candidate_family:out std_logic_vector(1 downto 0);
    word_known:out std_logic;
    accepted_family:out std_logic_vector(1 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal candidate:std_logic_vector(1 downto 0);
    signal known:std_logic;
    begin
    process(all)begin candidate<="00";
        if std_match(message,"00--")then candidate<="00";
        elsif std_match(message,"01--")then candidate<="10";
        elsif std_match(message,"1---")then candidate<="11";
        end if;
    end process;
    known<='1';
    candidate_family<=candidate;
    word_known<=known;
    accepted_family<="00";
end architecture;
