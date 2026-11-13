library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    generic (
        LANES : positive := 4
    );
    port (
        data : in std_logic_vector(LANES*8-1 downto 0);
        received_parity : in std_logic_vector(LANES-1 downto 0);
        error : out std_logic_vector(LANES-1 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    lane_gen: for i in 0 to LANES-1 generate p: entity work.parity8 port map(data=>data(i*8+7 downto i*8), parity=>received_parity(i), error=>error(i)); end generate;
end architecture;
